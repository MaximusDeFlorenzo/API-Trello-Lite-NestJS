export interface SearchField {
  field: string;
  type: "text" | "number" | "date" | "boolean" | "objectId";
  isPopulated?: boolean;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export class GlobalSearchUtil {
  static buildSearchQuery(
    searchTerm: string,
    searchFields: SearchField[],
    options: SearchOptions = {},
  ): Record<string, unknown> {
    if (!searchTerm || !searchFields || searchFields.length === 0) {
      return {};
    }

    const { caseSensitive = false, exactMatch = false } = options;
    const orConditions: Record<string, unknown>[] = [];

    searchFields.forEach(({ field, type }) => {
      const condition = this.buildFieldCondition(field, type, searchTerm, {
        caseSensitive,
        exactMatch,
      });

      if (condition) {
        orConditions.push(condition);
      }
    });

    return orConditions.length > 0 ? { $or: orConditions } : {};
  }

  static buildComplexSearchQuery(
    searchParams: Record<string, unknown>,
    searchFields: SearchField[],
    additionalFilters: Record<string, unknown> = {},
  ): Record<string, unknown> {
    const query: Record<string, unknown> = { ...additionalFilters };
    const orConditions: Record<string, unknown>[] = [];

    if (searchParams.search) {
      const searchQuery = this.buildSearchQuery(
        searchParams.search as string,
        searchFields,
      );
      if (searchQuery.$or) {
        orConditions.push(...(searchQuery.$or as Record<string, unknown>[]));
      }
    }

    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "search" || !value) return;

      const searchField = searchFields.find((f) => f.field === key);
      if (searchField) {
        const condition = this.buildFieldCondition(
          searchField.field,
          searchField.type,
          value,
          { exactMatch: true },
        );
        if (condition) {
          orConditions.push(condition);
        }
      }
    });

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    return query;
  }

  static buildDateRangeQuery(
    field: string,
    startDate?: string,
    endDate?: string,
  ): Record<string, unknown> {
    if (!startDate && !endDate) {
      return {};
    }

    const dateQuery: Record<string, unknown> = {};

    if (startDate) {
      dateQuery.$gte = new Date(startDate);
    }

    if (endDate) {
      dateQuery.$lte = new Date(endDate);
    }

    return { [field]: dateQuery };
  }

  static buildPaginationQuery(
    page: number = 1,
    limit: number = 10,
  ): {
    skip: number;
    limit: number;
  } {
    const skip = (page - 1) * limit;
    return { skip, limit };
  }

  static buildSortQuery(
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
  ): Record<string, 1 | -1> {
    return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  }

  private static buildFieldCondition(
    field: string,
    type: SearchField["type"],
    value: unknown,
    options: { caseSensitive?: boolean; exactMatch?: boolean },
  ): Record<string, unknown> | null {
    const { caseSensitive = false, exactMatch = false } = options;

    switch (type) {
      case "text":
        if (exactMatch) {
          return caseSensitive
            ? { [field]: value }
            : {
                [field]: {
                  $regex: `^${this.escapeRegex(String(value))}$`,
                  $options: "i",
                },
              };
        }
        return {
          [field]: {
            $regex: this.escapeRegex(String(value)),
            $options: caseSensitive ? "" : "i",
          },
        };

      case "number": {
        const numValue = Number(value);
        if (isNaN(numValue)) return null;
        return { [field]: numValue };
      }

      case "date": {
        const dateValue = new Date(value as string | number | Date);
        if (isNaN(dateValue.getTime())) return null;
        return { [field]: dateValue };
      }

      case "boolean": {
        const boolValue = value === "true" || value === true;
        return { [field]: boolValue };
      }

      case "objectId":
        return { [field]: value };

      default:
        return null;
    }
  }

  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  static async getTotalCount(
    model: {
      countDocuments: (filter: Record<string, unknown>) => Promise<number>;
    },
    filter: Record<string, unknown>,
  ): Promise<number> {
    return await model.countDocuments(filter);
  }

  static calculatePaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
