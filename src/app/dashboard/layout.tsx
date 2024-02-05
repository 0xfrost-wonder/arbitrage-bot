import { Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { MetamaskProvider } from "../../hooks/useMetamask";

export const metadata: Metadata = {
  title: "Examples",
  description: "Check out some examples app built using the components.",
};

interface ExamplesLayoutProps {
  children: React.ReactNode;
}

export default function ExamplesLayout({ children }: ExamplesLayoutProps) {
  return (
    <>
      <MetamaskProvider>
        <div className="container relative">
          <PageHeader>
            {/* <Announcement /> */}
            <PageHeaderHeading className="hidden md:block">
              Arbitrage Bot
            </PageHeaderHeading>
            <PageHeaderHeading className="md:hidden">
              Examples
            </PageHeaderHeading>
            <PageHeaderDescription>
              Arbitrage using Uniswap V2 and Sushi Swap.
            </PageHeaderDescription>
          </PageHeader>
          <section>
            <div className="overflow-hidden rounded-[0.5rem] border bg-background shadow-md md:shadow-xl">
              {children}
            </div>
          </section>
        </div>
      </MetamaskProvider>
    </>
  );
}
