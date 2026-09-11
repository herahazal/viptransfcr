import Loader from "./Loader";
import Hero from "./Hero";
import PlaneOutro from "./PlaneOutro";
import Services from "./Services";
import StartProject from "./StartProject";
import Community from "./Community";
import GlobalFooter from "./GlobalFooter";

export default function Page() {
  return (
    <>
      <Loader />
      <Hero />
      <PlaneOutro />
      <Services />
      <StartProject />
      <Community />
      <GlobalFooter />
    </>
  );
}
