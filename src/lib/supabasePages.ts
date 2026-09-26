const PAGE_SIZE = 500;

export async function loadAllPages<Row>(
    fetchPage: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: Error | null }>,
): Promise<Row[]> {
    const rows: Row[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data) throw new Error('Database returned no page data');
        rows.push(...data);
        if (data.length < PAGE_SIZE) return rows;
    }
}
