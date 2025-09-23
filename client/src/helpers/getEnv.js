export const getEnv = (envname) => {
    const env =  import.meta.env
    return env[envname]
}