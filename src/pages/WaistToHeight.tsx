import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhtrCalculatorCard from "@/components/whtr/WhtrCalculatorCard";
import ThreeReadingCalculator from "@/components/whtr/ThreeReadingCalculator";

export default function WaistToHeight() {
  return <main className="min-h-screen bg-background pt-24">
    <Navbar />
    <section className="container max-w-4xl px-4 py-12 space-y-6">
      <h1 className="text-3xl md:text-4xl font-heading font-bold">Waist-to-height calculator</h1>
      <p className="text-muted-foreground">Divide waist circumference at the navel by height using the same units. The Army's published benchmark is a ratio below 0.55. This personal estimate does not replace an official assessment.</p>
      <a className="inline-block underline underline-offset-4" href="https://www.armyresilience.army.mil/Army-Body-Composition-Program/">Army Body Composition Program: measurement guidance and current policy</a>
      <WhtrCalculatorCard />
      <ThreeReadingCalculator />
    </section>
    <Footer />
  </main>;
}
