import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { generateRecipeSteps } from "@/server/ai/generateRecipeSteps";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const cocktail = await prisma.cocktail.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  if (!cocktail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return cached steps if available
  if (Array.isArray(cocktail.recipeSteps) && (cocktail.recipeSteps as unknown[]).length > 0) {
    return NextResponse.json({ steps: cocktail.recipeSteps });
  }

  // Generate and cache
  const steps = await generateRecipeSteps({
    name: cocktail.name,
    method: cocktail.method,
    glassType: cocktail.glassType,
    ingredients: cocktail.ingredients.map(ci => ({
      name: ci.ingredient.name,
      amount: ci.amount,
    })),
  });

  await prisma.cocktail.update({
    where: { id },
    data: { recipeSteps: steps },
  });

  return NextResponse.json({ steps });
}
