import { defineDocumentType, makeSource } from "contentlayer/source-files";

const computedFields = {
  url: {
    type: "string",
    resolve: (doc: any) => `/${doc._raw.flattenedPath}`
  }
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `content/blog/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    date: { type: "date", required: true },
    locale: { type: "string", required: true }
  },
  computedFields
}));

export const SupportArticle = defineDocumentType(() => ({
  name: "SupportArticle",
  filePathPattern: `content/support/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    category: { type: "string", required: true },
    locale: { type: "string", required: true }
  },
  computedFields
}));

export const FaqArticle = defineDocumentType(() => ({
  name: "FaqArticle",
  filePathPattern: `content/faq/**/*.mdx`,
  contentType: "mdx",
  fields: {
    question: { type: "string", required: true },
    answer: { type: "string", required: true },
    locale: { type: "string", required: true }
  },
  computedFields
}));

export const City = defineDocumentType(() => ({
  name: "City",
  filePathPattern: `data/cities/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    locale: { type: "string", required: true },
    climate: { type: "string", required: true }
  },
  computedFields
}));

export const Country = defineDocumentType(() => ({
  name: "Country",
  filePathPattern: `data/countries/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    locale: { type: "string", required: true }
  },
  computedFields
}));

export default makeSource({
  contentDirPath: ".",
  documentTypes: [Post, SupportArticle, FaqArticle, City, Country]
});
