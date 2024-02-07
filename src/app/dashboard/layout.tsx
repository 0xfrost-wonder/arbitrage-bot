import { Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { MetamaskProvider } from "../../hooks/useMetamask";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Examples",
  description: "Check out some examples app built using the components.",
};

interface ExamplesLayoutProps {
  children: React.ReactNode;
}

export default async function ExamplesLayout({ children }: ExamplesLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/')
  }
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
