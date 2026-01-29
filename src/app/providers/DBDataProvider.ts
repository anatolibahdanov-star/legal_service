/* eslint-disable import/no-anonymous-default-export */
import { stringify } from 'query-string';
import { fetchUtils, DataProvider } from 'ra-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (apiUrl: any, httpClient = fetchUtils.fetchJson): DataProvider => ({
    getList: async (resource, params) => {
        const { page, perPage } = params.pagination || {};
        const { field, order } = params.sort || {};
        const query = {
            ...fetchUtils.flattenObject(params.filter),
            _sort: field,
            _order: order,
            _start:
                page != null && perPage != null
                    ? (page - 1) * perPage
                    : undefined,
            _end: page != null && perPage != null ? page * perPage : undefined,
            _embed: params?.meta?.embed,
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        const { headers, json } = await httpClient(url, {
            signal: params?.signal,
        });
        if (!headers.has('x-total-count')) {
            throw new Error(
                'The X-Total-Count header is missing in the HTTP Response. The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?'
            );
        }
        const totalString = headers.get('x-total-count')!.split('/').pop();
        if (totalString == null) {
            throw new Error(
                'The X-Total-Count header is invalid in the HTTP Response.'
            );
        }
        return { data: json, total: parseInt(totalString, 10) };
    },

    getOne: async (resource, params) => {
        let url = `${apiUrl}/${resource}/${params.id}`;
        if (params?.meta?.embed) {
            url += `?_embed=${params.meta.embed}`;
        }
        const { json } = await httpClient(url, { signal: params?.signal });
        return { data: json };
    },

    getMany: async (resource, params) => {
        const query = {
            id: params.ids,
            _embed: params?.meta?.embed,
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;
        const { json } = await httpClient(url, { signal: params?.signal });
        return { data: json };
    },

    getManyReference: async (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            ...fetchUtils.flattenObject(params.filter),
            [params.target]: params.id,
            _sort: field,
            _order: order,
            _start: (page - 1) * perPage,
            _end: page * perPage,
            _embed: params?.meta?.embed,
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        const { headers, json } = await httpClient(url, {
            signal: params?.signal,
        });

        if (!headers.has('x-total-count')) {
            throw new Error(
                'The X-Total-Count header is missing in the HTTP Response. The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?'
            );
        }
        const totalString = headers.get('x-total-count')!.split('/').pop();
        if (totalString == null) {
            throw new Error(
                'The X-Total-Count header is invalid in the HTTP Response.'
            );
        }
        return { data: json, total: parseInt(totalString, 10) };
    },

    update: async (resource, params) => {
        const { json } = await httpClient(
            `${apiUrl}/${resource}/${params.id}`,
            {
                method: 'PUT',
                body: JSON.stringify(params.data),
            }
        );
        return { data: json };
    },

    // json-server doesn't handle filters on UPDATE route, so we fallback to calling UPDATE n times instead
    updateMany: async (resource, params) => {
        const responses = await Promise.all(
            params.ids.map(id =>
                httpClient(`${apiUrl}/${resource}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(params.data),
                })
            )
        );
        return { data: responses.map(({ json }) => json.id) };
    },

    create: async (resource, params) => {
        const { json } = await httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        });
        return { data: { ...params.data, ...json } as any };
    },

    delete: async (resource, params) => {
        const { json } = await httpClient(
            `${apiUrl}/${resource}/${params.id}`,
            { method: 'DELETE' }
        );
        return { data: json };
    },

    // json-server doesn't handle filters on DELETE route, so we fallback to calling DELETE n times instead
    deleteMany: async (resource, params) => {
        const responses = await Promise.all(
            params.ids.map(id =>
                httpClient(`${apiUrl}/${resource}/${id}`, {
                    method: 'DELETE',
                })
            )
        );
        return { data: responses.map(({ json }) => json.id) };
    },
});