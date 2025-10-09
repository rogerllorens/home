import { render, screen } from "@testing-library/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders triggers", () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">Uno</TabsTrigger>
          <TabsTrigger value="two">Dos</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Contenido uno</TabsContent>
        <TabsContent value="two">Contenido dos</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Uno")).toBeInTheDocument();
    expect(screen.getByText("Contenido uno")).toBeInTheDocument();
  });
});
