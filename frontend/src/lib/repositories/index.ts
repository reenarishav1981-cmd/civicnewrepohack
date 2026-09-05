import { ICivicRepository } from "./ICivicRepository";
import { InMemoryCivicRepository } from "./InMemoryCivicRepository";
import { PrismaCivicRepository } from "./PrismaCivicRepository";
import { env } from "../config";

// Singletons
const inMemoryRepo = new InMemoryCivicRepository();
const prismaRepo = new PrismaCivicRepository();

/**
 * Repository Factory
 * Dynamically resolves repository backend based on DATA_PROVIDER ("prisma" | "memory").
 */
export function getCivicRepository(): ICivicRepository {
  if (env.DATA_PROVIDER === "memory") {
    return inMemoryRepo;
  }
  return prismaRepo;
}

export const civicRepository: ICivicRepository = getCivicRepository();
