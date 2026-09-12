import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import H2FSection from "@/components/H2FSection";

const images = [
  { file: "system.jpg", title: "H2F system", alt: "H2F system: governance, program, equipment and facilities, personnel, and leader education support physical readiness and mental toughness." },
  { file: "domains.jpg", title: "Five readiness domains", alt: "H2F readiness domains: mental, sleep, nutritional, physical, and spiritual readiness." },
  { file: "infographic.jpg", title: "Readiness infographic", alt: "H2F infographic describing injury prevention, health, sleep, and readiness impacts." },
  { file: "why-h2f.png", title: "Why the Army needs H2F", alt: "H2F supporting graphic describing injury, body composition, sleep, and force availability." },
];

export default function H2F() {
  return <main className="min-h-screen bg-background pt-24">
    <Navbar />
    <div className="container px-4 pt-10"><h1 className="text-4xl font-heading font-bold">Holistic Health and Fitness</h1></div>
    <H2FSection />
    <section className="container px-4 pb-16 space-y-8">
      <p className="text-muted-foreground">Supporting educational graphics are provided below. Some contain historical statistics, including 2019 figures; consult the official resources for current guidance.</p>
      <div className="flex flex-wrap gap-6 underline underline-offset-4">
        <a href="https://h2f.army.mil/">Official H2F resources</a>
        <a href="https://www.goarmy.com/explore-the-army/holistic-health-fitness">GoArmy H2F overview</a>
        <a href="https://www.armyresilience.army.mil/Army-Body-Composition-Program/">Army Body Composition Program</a>
      </div>
      <div className="grid md:grid-cols-2 gap-8">{images.map(image => <figure key={image.file} className="glass rounded-xl p-4">
        <a href={`/h2f/${image.file}`} aria-label={`Open full-size ${image.title}`}><img src={`/h2f/${image.file}`} alt={image.alt} loading="lazy" className="w-full h-auto rounded-lg" /></a>
        <figcaption className="mt-3 font-medium">{image.title} — select image to view full size</figcaption>
      </figure>)}</div>
    </section>
    <Footer />
  </main>;
}
