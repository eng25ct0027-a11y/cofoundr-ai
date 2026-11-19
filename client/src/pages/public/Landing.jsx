import Navbar from '../../components/landing/Navbar';
import Hero from '../../components/landing/Hero';
import Features from '../../components/landing/Features';
import HowItWorks from '../../components/landing/HowItWorks';
import MatchSection from '../../components/landing/MatchSection';
import Testimonials from '../../components/landing/Testimonials';
import CTA from '../../components/landing/CTA';
import Footer from '../../components/landing/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function Landing() {
  useDocumentTitle('');

  return (
    <div className="landing">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <MatchSection />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
