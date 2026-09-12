import { Link } from "react-router-dom";

export default function H2FSection() {
  return <section className="container px-4 py-16" aria-labelledby="h2f-heading">
    <div className="glass rounded-2xl p-6 md:p-10 flex flex-col sm:flex-row items-center gap-8">
      <a href="https://h2f.army.mil/" aria-label="Visit Army Holistic Health and Fitness">
        <img src="/h2f/logo.png" alt="U.S. Army Holistic Health and Fitness" width={208} height={208} loading="lazy" className="w-36 h-36 object-contain" />
      </a>
      <div className="flex-1 space-y-4">
        <p className="text-primary font-medium">Sponsored by H2F</p>
        <h2 id="h2f-heading" className="text-3xl font-heading font-bold">Readiness throughout the year</h2>
        <p className="text-muted-foreground">Double Eagle Fitness (DeFit) supports continuous training across the calendar year, with challenges throughout the year. The Double Eagle Challenge brings a focused training cycle each January after the holidays. Check each challenge for its enrollment and scoring dates.</p>
        <p className="text-muted-foreground">H2F addresses five readiness domains: physical, mental, nutritional, sleep, and spiritual. These complement DeFit's four workout categories.</p>
        <div className="flex flex-wrap gap-4 underline underline-offset-4">
          <Link to="/challenge">Explore challenges</Link>
          <Link to="/waist-to-height">Waist-to-height calculator</Link>
          <Link to="/h2f">H2F resources and images</Link>
        </div>
      </div>
    </div>
  </section>;
}
