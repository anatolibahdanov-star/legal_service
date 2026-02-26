import {SelectItem} from "@/src/app/components/ui/select";
import { getCategories } from "@/src/repositories/categories/repo";

export async function SelectCategories() {
    const categories = await getCategories("1", "30");
    if(categories === null) return (<></>)

    return (
        <>
            {categories.map((category) => (
                <SelectItem key={'low-category-' + category.id} value={category.name}>{category.name}</SelectItem>
            ))}
        </>
    )
}