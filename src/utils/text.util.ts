export class TextUtil {
  static capitalizeFirstWord(text: string): string {
    if (!text) return "";

    const lowercased = text.toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
}
