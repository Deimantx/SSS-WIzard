import { DEVELOPER_SCENARIO_DB_NAME, DEVELOPER_SCENARIO_DB_VERSION, DEVELOPER_SCENARIO_STORE, type DeveloperScenarioRecord } from './customScenarioTypes'

export type ScenarioStorageStatus = { available: true } | { available: false; reason: string }

const unavailable = (reason: string): ScenarioStorageStatus => ({ available: false, reason })
const openDatabase = (factory: IDBFactory | undefined = globalThis.indexedDB): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!factory) { reject(new Error('IndexedDB is unavailable in this browser context.')); return }
  const request = factory.open(DEVELOPER_SCENARIO_DB_NAME, DEVELOPER_SCENARIO_DB_VERSION)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(DEVELOPER_SCENARIO_STORE)) db.createObjectStore(DEVELOPER_SCENARIO_STORE, { keyPath: 'id' })
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('Could not open the Developer Scenario Library.'))
  request.onblocked = () => reject(new Error('Close other game tabs to finish updating the Developer Scenario Library.'))
})

const requestResult = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('Developer Scenario Library request failed.'))
})

export const getScenarioStorageStatus = async (): Promise<ScenarioStorageStatus> => {
  try { const db = await openDatabase(); db.close(); return { available: true } }
  catch (error) { return unavailable(error instanceof Error ? error.message : 'IndexedDB is unavailable.') }
}

const withStore = async <T,>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDatabase()
  try {
    const tx = db.transaction(DEVELOPER_SCENARIO_STORE, mode)
    const result = await requestResult(run(tx.objectStore(DEVELOPER_SCENARIO_STORE)))
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Library update was cancelled.')) })
    return result
  } finally { db.close() }
}

export const listCustomScenarios = () => withStore<DeveloperScenarioRecord[]>('readonly', (store) => store.getAll())
export const putCustomScenario = (record: DeveloperScenarioRecord) => withStore<IDBValidKey>('readwrite', (store) => store.put(record))
export const deleteCustomScenario = (id: string) => withStore<undefined>('readwrite', (store) => store.delete(id))
export const getCustomScenario = (id: string) => withStore<DeveloperScenarioRecord | undefined>('readonly', (store) => store.get(id))
