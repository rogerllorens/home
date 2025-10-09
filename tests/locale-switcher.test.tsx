import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useRouter, usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe("LocaleSwitcher", () => {
  it("renders locales and triggers navigation", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (usePathname as jest.Mock).mockReturnValue("/es/features");
    render(<LocaleSwitcher currentLocale="es" />);
    const english = screen.getByRole("button", { name: /english/i });
    await act(async () => {
      await userEvent.click(english);
    });
    expect(push).toHaveBeenCalled();
  });
});
