import { render, screen } from "@testing-library/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

describe("Accordion", () => {
  it("renders items", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Pregunta</AccordionTrigger>
          <AccordionContent>Respuesta</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(screen.getByText("Pregunta")).toBeInTheDocument();
  });
});
