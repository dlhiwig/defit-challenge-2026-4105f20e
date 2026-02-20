#!/usr/bin/env python3
"""
Import Firestore JSONL export to Neon PostgreSQL - Batch Version
Uses batch commits to avoid timeout/memory issues
"""

import json
import os
import sys

sys.stdout.reconfigure(line_buffering=True)

import psycopg2

DATABASE_URL = 'postgresql://neondb_owner:npg_U9EJiRS7QOzB@ep-wandering-hall-ait7jmnu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

def parse_firestore_value(val):
    if val is None:
        return None
    if isinstance(val, dict):
        if 'stringValue' in val:
            return val['stringValue']
        if 'integerValue' in val:
            return int(val['integerValue'])
        if 'doubleValue' in val:
            return float(val['doubleValue'])
        if 'booleanValue' in val:
            return val['booleanValue']
        if 'nullValue' in val:
            return None
        if 'timestampValue' in val:
            return val['timestampValue']
        if 'mapValue' in val:
            return {k: parse_firestore_value(v) for k, v in val['mapValue'].get('fields', {}).items()}
        if 'arrayValue' in val:
            return [parse_firestore_value(v) for v in val['arrayValue'].get('values', [])]
    return val

def parse_document(line):
    doc = json.loads(line)
    name = doc.get('name', '')
    fields = doc.get('fields', {})
    
    parts = name.split('/documents/')
    if len(parts) < 2:
        return None, None, None
    
    path = parts[1]
    path_parts = path.split('/')
    collection = path_parts[0]
    doc_id = path_parts[1] if len(path_parts) > 1 else None
    
    data = {k: parse_firestore_value(v) for k, v in fields.items()}
    data['_doc_id'] = doc_id
    
    return collection, doc_id, data

def main():
    jsonl_path = sys.argv[1] if len(sys.argv) > 1 else '/mnt/c/Users/Chris/Downloads/defit8_midcycle_v2/DEFIT_8_firestore_export.jsonl'
    
    print(f"Reading {jsonl_path}...")
    
    # Parse all documents first
    users, workout_logs, teams, commands, challenges = [], [], [], [], []
    
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            collection, doc_id, data = parse_document(line)
            if collection == 'users':
                users.append(data)
            elif collection == 'workoutLogs':
                workout_logs.append(data)
            elif collection == 'teams':
                teams.append(data)
            elif collection == 'commands':
                commands.append(data)
            elif collection == 'challenges':
                challenges.append(data)
    
    print(f"Parsed: {len(users)} users, {len(workout_logs)} logs, {len(teams)} teams, {len(commands)} commands, {len(challenges)} challenges")
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Step 1: Create schema
    print("Creating schema...")
    cur.execute("""
        DROP TABLE IF EXISTS fs_workout_logs, fs_teams, fs_commands, fs_challenges, fs_users CASCADE;
        
        CREATE TABLE fs_users (
            id TEXT PRIMARY KEY,
            display_name TEXT,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            rank TEXT,
            branch TEXT,
            component TEXT,
            command TEXT,
            uic TEXT,
            team_name TEXT,
            age INTEGER,
            gender TEXT,
            address JSONB,
            challenge_iteration INTEGER,
            created_at TEXT,
            first_workout_date TEXT,
            last_active_date TEXT,
            streak_count INTEGER,
            notification_prefs JSONB,
            role TEXT,
            status TEXT
        );
        
        CREATE TABLE fs_workout_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            week INTEGER,
            challenge_iteration INTEGER,
            activities JSONB,
            totals JSONB,
            score NUMERIC,
            submitted_at TEXT
        );
        
        CREATE TABLE fs_teams (
            id TEXT PRIMARY KEY,
            name TEXT,
            category TEXT,
            command TEXT,
            member_count INTEGER,
            total_score NUMERIC,
            average_score NUMERIC,
            members JSONB
        );
        
        CREATE TABLE fs_commands (
            id TEXT PRIMARY KEY,
            name TEXT,
            personnel_count INTEGER,
            total_score NUMERIC,
            members JSONB
        );
        
        CREATE TABLE fs_challenges (
            id TEXT PRIMARY KEY,
            name TEXT,
            iteration INTEGER,
            start_date TEXT,
            end_date TEXT,
            status TEXT,
            activation_rate NUMERIC
        );
    """)
    conn.commit()
    print("Schema created ✓")
    
    # Step 2: Insert users in batches
    print(f"Inserting {len(users)} users...")
    batch_size = 100
    for i in range(0, len(users), batch_size):
        batch = users[i:i+batch_size]
        for u in batch:
            addr = u.get('address', {})
            cur.execute("""
                INSERT INTO fs_users (id, display_name, email, first_name, last_name, rank, branch, 
                    component, command, uic, team_name, age, gender, address,
                    challenge_iteration, created_at, first_workout_date, last_active_date,
                    streak_count, notification_prefs, role, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                u.get('id'), u.get('displayName'), u.get('email'), u.get('firstName'),
                u.get('lastName'), u.get('rank'), u.get('branch'), u.get('component'),
                u.get('command'), u.get('uic'), u.get('teamName'), u.get('age'),
                u.get('gender'), json.dumps(addr) if addr else None, u.get('challengeIteration'),
                u.get('createdAt'), u.get('firstWorkoutDate'), u.get('lastActiveDate'),
                u.get('streakCount'), json.dumps(u.get('notificationPrefs', {})),
                u.get('role'), u.get('status')
            ))
        conn.commit()
        print(f"  Users: {min(i+batch_size, len(users))}/{len(users)}")
    
    # Step 3: Insert workout logs in batches
    print(f"Inserting {len(workout_logs)} workout logs...")
    for i in range(0, len(workout_logs), batch_size):
        batch = workout_logs[i:i+batch_size]
        for w in batch:
            cur.execute("""
                INSERT INTO fs_workout_logs (id, user_id, week, challenge_iteration, activities, totals, score, submitted_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                w.get('_doc_id') or w.get('id'), w.get('userId'), w.get('week'),
                w.get('challengeIteration'), json.dumps(w.get('activities', {})),
                json.dumps(w.get('totals', {})), w.get('score'), w.get('submittedAt')
            ))
        conn.commit()
        print(f"  Logs: {min(i+batch_size, len(workout_logs))}/{len(workout_logs)}")
    
    # Step 4: Insert teams
    print(f"Inserting {len(teams)} teams...")
    for t in teams:
        cur.execute("""
            INSERT INTO fs_teams (id, name, category, command, member_count, total_score, average_score, members)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            t.get('_doc_id') or t.get('id'), t.get('teamName') or t.get('name'),
            t.get('category'), t.get('command'), t.get('memberCount'),
            t.get('totalScore'), t.get('averageScore'), json.dumps(t.get('members', []))
        ))
    conn.commit()
    print("Teams done ✓")
    
    # Step 5: Insert commands
    print(f"Inserting {len(commands)} commands...")
    for c in commands:
        cur.execute("""
            INSERT INTO fs_commands (id, name, personnel_count, total_score, members)
            VALUES (%s,%s,%s,%s,%s)
        """, (
            c.get('_doc_id') or c.get('id'), c.get('commandName') or c.get('name'),
            c.get('personnelCount'), c.get('totalScore'), json.dumps(c.get('members', []))
        ))
    conn.commit()
    print("Commands done ✓")
    
    # Step 6: Insert challenges
    print(f"Inserting {len(challenges)} challenges...")
    for ch in challenges:
        cur.execute("""
            INSERT INTO fs_challenges (id, name, iteration, start_date, end_date, status, activation_rate)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            ch.get('_doc_id') or ch.get('id'), ch.get('name'), ch.get('iteration'),
            ch.get('startDate'), ch.get('endDate'), ch.get('status'), ch.get('activationRate')
        ))
    conn.commit()
    print("Challenges done ✓")
    
    # Summary
    print("\n✅ Import complete!")
    for tbl in ['fs_users', 'fs_workout_logs', 'fs_teams', 'fs_commands', 'fs_challenges']:
        cur.execute(f'SELECT COUNT(*) FROM {tbl}')
        print(f"   {tbl}: {cur.fetchone()[0]} rows")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
