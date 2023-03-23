import { windowOpen } from "./windowOpen.";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Xumm } from "xumm";
import {
  CreatedPayload,
  XummJsonTransaction,
  XummPayload,
  XummPostPayloadBodyBlob,
  XummPostPayloadBodyJson,
} from "xumm-sdk/dist/src/types";

type PromiseType<T> = T extends Promise<infer P> ? P : never;
type RemovePromisified<T> = { [P in keyof T]: PromiseType<T[P]> };

type User = RemovePromisified<Xumm["user"]>;
type Environment = RemovePromisified<
  Omit<Xumm["environment"], "retrieving" | "ready" | "success" | "retrieved">
>;
type SignTransactionCreatePayload =
  | XummPostPayloadBodyJson
  | XummPostPayloadBodyBlob
  | XummJsonTransaction;
type SignTransactionOption = {
  onPayloadCreated?: (payload: CreatedPayload) => void;
};

type ReturnType = {
  status: "loading" | "connected" | "unconnected";
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (
    payload: SignTransactionCreatePayload,
    option?: SignTransactionOption
  ) => Promise<XummPayload | null | undefined>;
  user?: User;
  environment?: Environment;
  xumm: Xumm;
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
  const [environment, setEnvironment] = useState<Environment | undefined>(
    undefined
  );
  // signIn status
  const status = useMemo(
    () => (loading ? "loading" : user ? "connected" : "unconnected"),
    [loading, user]
  );

  /**
   * Resolved user object
   */
  const getUser = useCallback(async () => {
    const _user = Object.keys(xumm.user) as (keyof Xumm["user"])[];
    Promise.all(_user.map(async (u) => ({ [u]: await xumm.user[u] }))).then(
      (_user) => {
        const user = Object.assign({}, ..._user);
        setUser(user);
      }
    );
  }, [xumm.user]);

  /**
   * Resolved environment object
   */
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

  /**
   * Connect to Xumm
   */
  const connect = useCallback(async () => {
    await xumm.authorize();
  }, [xumm]);

  /**
   * Disconnect from Xumm
   */
  const disconnect = useCallback(async () => {
    if (xumm.runtime.xapp) {
      await xumm.xapp?.close();
    } else {
      await xumm.logout();
      setUser(undefined);
      setEnvironment(undefined);
    }
  }, [xumm]);

  /**
   * Sign Transaction and wait for payload status change
   * @param payload
   * @param option
   * @returns
   */
  const signTransaction = async (
    payload: SignTransactionCreatePayload,
    option?: SignTransactionOption
  ) => {
    let pcWindowId: Window | null;
    const createdPayload = await xumm.payload?.create(payload);
    if (!createdPayload) throw new Error("Invalid Payload Parameter");
    const uuid = createdPayload.uuid;
    if (option?.onPayloadCreated) {
      // action on payload created if you want
      option.onPayloadCreated(createdPayload);
    } else {
      // open popup window(pc)
      pcWindowId = windowOpen(createdPayload.next.always);
    }
    // get subscription websocket
    const subscription = await xumm.payload?.subscribe(uuid);
    if (!subscription) return;
    subscription.websocket.onmessage = (message) => {
      // resolve promise when receive signed message
      if (message.data.toString().match(/signed/)) {
        // close popup window(pc)
        setTimeout(() => pcWindowId?.close(), 1500);
        const json = JSON.parse(message.data.toString());
        subscription.resolve(json.signed);
      }
    };
    await subscription.resolved;

    const result = await xumm.payload?.get(uuid);
    return result;
  };

  return {
    status,
    connect,
    disconnect,
    signTransaction,
    user,
    environment,
    xumm,
  };
};
