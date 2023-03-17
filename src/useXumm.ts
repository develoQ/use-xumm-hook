import { useCallback, useEffect, useMemo, useState } from "react";
import { Xumm } from "xumm";

type PromiseType<T> = T extends Promise<infer P> ? P : never;
type RemovePromisified<T> = { [P in keyof T]: PromiseType<T[P]> };

type User = RemovePromisified<Xumm["user"]>;
type _Enviroment = RemovePromisified<
  Omit<Xumm["environment"], "retrieving" | "ready" | "success" | "retrieved">
>;
type Environment = _Enviroment & {
  retrieving: Promise<void>;
  ready: Promise<void>;
  success: Promise<void>;
  retrieved: Promise<void>;
};

type ReturnType = Omit<Xumm, "user" | "environment"> & {
  loading: boolean;
  user?: User;
  environment: Environment;
};

export const useXumm = (
  apiKeyOrJwt: string,
  apiSecretOrOtt?: string | undefined
): ReturnType => {
  const [loading, setLoading] = useState(true);
  const xumm = useMemo(() => {
    const xumm = new Xumm(apiKeyOrJwt, apiSecretOrOtt);
    xumm.on("ready", () => setLoading(false));
    return xumm;
  }, [apiKeyOrJwt, apiSecretOrOtt]);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [environment, setEnvironment] = useState<_Enviroment | undefined>(
    undefined
  );

  const getUser = useCallback(async () => {
    const _user = Object.keys(xumm.user) as (keyof Xumm["user"])[];
    Promise.all(_user.map(async (u) => ({ [u]: await xumm.user[u] }))).then(
      (_user) => {
        const user = Object.assign({}, ..._user);
        setUser(user);
      }
    );
  }, [xumm.user]);

  const getEnvironment = useCallback(async () => {
    const _env = Object.keys(xumm.environment) as (keyof Xumm["environment"])[];
    Promise.all(
      _env
        .filter(
          (e) => !["retrieving", "ready", "success", "retrieved"].includes(e)
        )
        .map(async (e) => ({ [e]: await xumm.environment[e] }))
    ).then((_environment) => {
      const environment = Object.assign({}, ..._environment);
      setEnvironment(environment);
    });
  }, [xumm.environment]);

  useEffect(() => {
    const fetch = () => {
      getUser();
      getEnvironment();
    };
    xumm.on("ready", fetch);
    xumm.on("success", fetch);
    xumm.on("retrieved", fetch);
  }, [getEnvironment, getUser, xumm]);

  const logout = useCallback(async () => {
    await xumm.logout();
    setUser(undefined)
    setEnvironment(undefined)
  }, []);

  return {
    ...xumm,
    loading,
    authorize: xumm.authorize,
    logout,
    ping: xumm.ping,
    user,
    environment: {
      ...environment,
      retrieving: xumm.environment.retrieving,
      ready: xumm.environment.ready,
      success: xumm.environment.success,
      retrieved: xumm.environment.retrieved,
    },
  };
};
