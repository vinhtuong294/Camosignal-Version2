import Head from "next/head";
import { DashboardV2 } from "@/components/dashboard-v2";
import { sampleAnalysis } from "@/lib/sample-analysis";

export default function Home() {
  return (
    <>
      <Head>
        <title>CamoSignal Insight Engine V2</title>
        <meta name="description" content="POD product analytics dashboard for CamoSignal." />
      </Head>
      <DashboardV2 analysis={sampleAnalysis} />
    </>
  );
}
