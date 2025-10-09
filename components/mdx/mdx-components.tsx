import { useMDXComponent } from "next-contentlayer/hooks";
import Callout from "@/components/mdx/callout";
import Link from "next/link";

const components = {
  Callout,
  a: Link
};

export function Mdx({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}
