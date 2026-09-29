import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SmoothScroll from "@/components/SmoothScroll";
import { Gallery, HorizontalReel, LagoaBand } from "@/components/Gallery";
import ChatWidget from "@/components/ChatWidget";
import { Marquee, Manifesto, Attractions, Stats, Membership, Hours, Location, FAQ, LeadForm, Footer } from "@/components/Sections";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Nav />
      <Hero />
      <Marquee />
      <Manifesto />
      <Attractions />
      <HorizontalReel />
      <Stats />
      <Membership />
      <Gallery />
      <Hours />
      <LagoaBand />
      <Location />
      <FAQ />
      <LeadForm />
      <Footer />
      <ChatWidget />
    </main>
  );
}
