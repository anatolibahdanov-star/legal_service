import { useState, useEffect } from 'react';
import {SelectItem} from "@/src/app/components/ui/select";
import { CustomGetRequest } from "@/src/libs/request"
import { CategoryDataI } from '@/src/interfaces/form';

export function SelectCategories() {
    const [data, setData] = useState<CategoryDataI | null>(null);

    useEffect(() => {
        const path = "/categories"
        const request = {page: 1, limit: 30}
        
        const fetchData = async () => {
            const categoryData = await CustomGetRequest(path, request)
            console.log('categoryData', categoryData)
            console.log('categoryData count', categoryData)
            if(categoryData.status) {
                const count = categoryData.count ?? 0
                setData({data: categoryData.data, count: count})
            }
        };

        fetchData();
    }, []);

    if(data === null) return (<></>)
    const categories = data.data

    return (
        <>
            {categories.map((category) => (
                <SelectItem key={'low-category-' + category.id} value={category.name}>{category.name}</SelectItem>
            ))}
        </>
    )
}