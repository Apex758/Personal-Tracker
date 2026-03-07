import { notFound } from 'next/navigation';
import { ModuleWorkspace } from '@/components/module-workspace';
import { GroceryWorkspace } from '@/components/grocery-workspace';
import { RecipeWorkspace } from '@/components/recipe-workspace';
import { getRows } from '@/lib/data';
import { getModule } from '@/lib/modules';

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getModule(slug);
  if (!module) notFound();

  const rows = await getRows(module.slug);

  if (slug === 'grocery') {
    return <GroceryWorkspace initialRows={rows} />;
  }

  if (slug === 'recipe') {
    return <RecipeWorkspace initialRows={rows} />;
  }

  return <ModuleWorkspace module={module} initialRows={rows} />;
}