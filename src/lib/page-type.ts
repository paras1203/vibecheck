export type PageTypeGuess = "landing" | "blog" | "product" | "unknown";

export function detectPageType(
  url: string,
  html: string,
  text: string
): PageTypeGuess {
  try {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("/blog") || lowerUrl.includes("/article")) {
      return "blog";
    }

    if (lowerUrl.includes("/product")) {
      return "product";
    }

    if (text.length > 2000 && html.includes("<article")) {
      return "blog";
    }

    if (html.includes("Add to Cart") || html.includes("Buy Now")) {
      return "product";
    }

    return "landing";
  } catch {
    return "unknown";
  }
}
