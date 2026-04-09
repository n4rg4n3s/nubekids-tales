export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        if (
            error &&
            typeof error === 'object' &&
            error.code === 'ERR_MODULE_NOT_FOUND' &&
            typeof specifier === 'string' &&
            specifier.startsWith('.') &&
            !specifier.endsWith('.ts') &&
            !specifier.endsWith('.js') &&
            !specifier.endsWith('.mjs') &&
            !specifier.endsWith('.json')
        ) {
            return nextResolve(`${specifier}.ts`, context);
        }

        throw error;
    }
}
