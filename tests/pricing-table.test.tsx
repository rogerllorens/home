import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { PricingTable } from "@/components/sections/pricing-table";

type ChildrenProps = { children?: ReactNode };

jest.mock("next-intl", () => ({
  useTranslations: () => {
    return Object.assign((key: string) => key, {
      raw: () => [
        {
          name: "FREE",
          price: "0",
          period: "€/mes",
          description: "Plan base",
          features: ["Feature A"],
        },
      ],
    });
  },
  useLocale: () => "es",
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: ChildrenProps) => <div>{children}</div>,
  TabsList: ({ children }: ChildrenProps) => <div>{children}</div>,
  TabsTrigger: ({ children }: ChildrenProps) => (
    <button type="button">{children}</button>
  ),
  TabsContent: ({ children }: ChildrenProps) => <div>{children}</div>,
}));

describe("PricingTable", () => {
  it("renders plan information", () => {
    render(<PricingTable />);
    expect(screen.getAllByText(/Plan base/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Feature A/).length).toBeGreaterThan(0);
  });
});
