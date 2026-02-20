#!/usr/bin/env python3
"""
Import Firestore JSONL export to Neon PostgreSQL
Transforms Firestore document format to relational schema
"""

import json
import os
import sys
from datetime import datetime

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Installing psycopg2-binary...")
    os.system("pip install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import execute_values

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_U9EJiRS7QOzB@ep-wandering-hall-ait7jmnu-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require')

def parse_firestore_value(val):
    """Convert Firestore typed value to Python native"""
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
    """Parse a Firestore JSONL line into collection type and data"""
    doc = json.loads(line)
    name = doc.get('name', '')
    fields = doc.get('fields', {})
    
    # Extract collection type from path
    # e.g., "projects/defit-app/databases/(default)/documents/users/user_996"
    parts = name.split('/documents/')
    if len(parts) < 2:
        return None, None, None
    
    path = parts[1]  # e.g., "users/user_996"
    path_parts = path.split('/')
    collection = path_parts[0]
    doc_id = path_parts[1] if len(path_parts) > 1 else None
    
    # Parse all fields
    data = {k: parse_firestore_value(v) for k, v in fields.items()}
    data['_doc_id'] = doc_id
    
    return collection, doc_id, data

def import_to_neon(jsonl_path):
    """Main import function"""
    print(f"Reading {jsonl_path}...")
    
    users = []
    workout_logs = []
    teams = []
    commands = []
    challenges = []
    
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
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
            except Exception as e:
                print(f"Error on line {line_num}: {e}")
    
    print(f"Parsed: {len(users)} users, {len(workout_logs)} workoutLogs, {len(teams)} teams, {len(commands)} commands, {len(challenges)} challenges")
    
    # Connect to Neon
    print(f"\nConnecting to Neon...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Create tables if needed
        print("Creating/updating schema...")
        cur.execute("""
            -- Users table (Firestore format)
            CREATE TABLE IF NOT EXISTS fs_users (
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
                team_category TEXT,
                age INTEGER,
                gender TEXT,
                address JSONB,
                challenge_iteration INTEGER,
                created_at TIMESTAMPTZ,
                first_workout_date TIMESTAMPTZ,
                last_active_date TIMESTAMPTZ,
                streak_count INTEGER,
                notification_prefs JSONB,
                role TEXT,
                status TEXT,
                raw_data JSONB
            );
            
            -- Workout logs table
            CREATE TABLE IF NOT EXISTS fs_workout_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                week INTEGER,
                challenge_iteration INTEGER,
                activities JSONB,
                totals JSONB,
                score NUMERIC,
                submitted_at TIMESTAMPTZ,
                raw_data JSONB
            );
            
            -- Teams table
            CREATE TABLE IF NOT EXISTS fs_teams (
                id TEXT PRIMARY KEY,
                name TEXT,
                category TEXT,
                command TEXT,
                member_count INTEGER,
                total_score NUMERIC,
                average_score NUMERIC,
                members JSONB,
                raw_data JSONB
            );
            
            -- Commands table
            CREATE TABLE IF NOT EXISTS fs_commands (
                id TEXT PRIMARY KEY,
                name TEXT,
                personnel_count INTEGER,
                total_score NUMERIC,
                members JSONB,
                raw_data JSONB
            );
            
            -- Challenges metadata
            CREATE TABLE IF NOT EXISTS fs_challenges (
                id TEXT PRIMARY KEY,
                name TEXT,
                iteration INTEGER,
                start_date TIMESTAMPTZ,
                end_date TIMESTAMPTZ,
                status TEXT,
                activation_rate NUMERIC,
                raw_data JSONB
            );
        """)
        
        # Clear existing data
        print("Clearing existing fs_* tables...")
        cur.execute("TRUNCATE fs_users, fs_workout_logs, fs_teams, fs_commands, fs_challenges CASCADE;")
        
        # Insert users
        print(f"Inserting {len(users)} users...")
        for u in users:
            addr = u.get('address', {})
            cur.execute("""
                INSERT INTO fs_users (id, display_name, email, first_name, last_name, rank, branch, 
                    component, command, uic, team_name, team_category, age, gender, address,
                    challenge_iteration, created_at, first_workout_date, last_active_date,
                    streak_count, notification_prefs, role, status, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
            """, (
                u.get('id'),
                u.get('displayName'),
                u.get('email'),
                u.get('firstName'),
                u.get('lastName'),
                u.get('rank'),
                u.get('branch'),
                u.get('component'),
                u.get('command'),
                u.get('uic'),
                u.get('teamName'),
                u.get('teamCategory'),
                u.get('age'),
                u.get('gender'),
                json.dumps(addr) if addr else None,
                u.get('challengeIteration'),
                u.get('createdAt'),
                u.get('firstWorkoutDate'),
                u.get('lastActiveDate'),
                u.get('streakCount'),
                json.dumps(u.get('notificationPrefs', {})),
                u.get('role'),
                u.get('status'),
                json.dumps(u)
            ))
        
        # Insert workout logs
        print(f"Inserting {len(workout_logs)} workout logs...")
        for w in workout_logs:
            cur.execute("""
                INSERT INTO fs_workout_logs (id, user_id, week, challenge_iteration, activities, totals, score, submitted_at, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
            """, (
                w.get('_doc_id') or w.get('id'),
                w.get('userId'),
                w.get('week'),
                w.get('challengeIteration'),
                json.dumps(w.get('activities', {})),
                json.dumps(w.get('totals', {})),
                w.get('score'),
                w.get('submittedAt'),
                json.dumps(w)
            ))
        
        # Insert teams
        print(f"Inserting {len(teams)} teams...")
        for t in teams:
            cur.execute("""
                INSERT INTO fs_teams (id, name, category, command, member_count, total_score, average_score, members, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
            """, (
                t.get('_doc_id') or t.get('id'),
                t.get('teamName') or t.get('name'),
                t.get('category'),
                t.get('command'),
                t.get('memberCount'),
                t.get('totalScore'),
                t.get('averageScore'),
                json.dumps(t.get('members', [])),
                json.dumps(t)
            ))
        
        # Insert commands
        print(f"Inserting {len(commands)} commands...")
        for c in commands:
            cur.execute("""
                INSERT INTO fs_commands (id, name, personnel_count, total_score, members, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
            """, (
                c.get('_doc_id') or c.get('id'),
                c.get('commandName') or c.get('name'),
                c.get('personnelCount'),
                c.get('totalScore'),
                json.dumps(c.get('members', [])),
                json.dumps(c)
            ))
        
        # Insert challenges
        print(f"Inserting {len(challenges)} challenges...")
        for ch in challenges:
            cur.execute("""
                INSERT INTO fs_challenges (id, name, iteration, start_date, end_date, status, activation_rate, raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
            """, (
                ch.get('_doc_id') or ch.get('id'),
                ch.get('name'),
                ch.get('iteration'),
                ch.get('startDate'),
                ch.get('endDate'),
                ch.get('status'),
                ch.get('activationRate'),
                json.dumps(ch)
            ))
        
        conn.commit()
        print("\n✅ Import complete!")
        
        # Summary
        cur.execute("SELECT COUNT(*) FROM fs_users")
        print(f"   fs_users: {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM fs_workout_logs")
        print(f"   fs_workout_logs: {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM fs_teams")
        print(f"   fs_teams: {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM fs_commands")
        print(f"   fs_commands: {cur.fetchone()[0]} rows")
        cur.execute("SELECT COUNT(*) FROM fs_challenges")
        print(f"   fs_challenges: {cur.fetchone()[0]} rows")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    jsonl_path = sys.argv[1] if len(sys.argv) > 1 else '/mnt/c/Users/Chris/Downloads/defit8_midcycle_v2/DEFIT_8_firestore_export.jsonl'
    import_to_neon(jsonl_path)
