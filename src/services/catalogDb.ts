import { DofusItem } from '../types'

const DB_NAME = 'dofuscraft_catalog_db'
const DB_VERSION = 1
const STORE_NAME = 'items'

let dbPromise: Promise<IDBDatabase | null> | null = null

function getDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'ankama_id' })
          store.createIndex('category', 'category', { unique: false })
          store.createIndex('level', 'level', { unique: false })
          store.createIndex('name', 'name', { unique: false })
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = (err) => {
        console.warn('IndexedDB failed to open:', err)
        resolve(null)
      }
    })
  }

  return dbPromise
}

/**
 * Save multiple items to IndexedDB in a single transaction
 */
export async function saveItemsToDb(items: DofusItem[]): Promise<void> {
  if (!items || items.length === 0) return
  const db = await getDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      for (const item of items) {
        if (item && item.ankama_id) {
          store.put(item)
        }
      }

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    } catch (err) {
      console.warn('saveItemsToDb transaction error:', err)
      resolve()
    }
  })
}

/**
 * Retrieve all items stored in IndexedDB
 */
export async function getAllItemsFromDb(): Promise<DofusItem[]> {
  const db = await getDb()
  if (!db) return []

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        resolve([])
      }
    } catch {
      resolve([])
    }
  })
}

/**
 * Get total item count in IndexedDB
 */
export async function getItemCountFromDb(): Promise<number> {
  const db = await getDb()
  if (!db) return 0

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.count()

      request.onsuccess = () => resolve(request.result || 0)
      request.onerror = () => resolve(0)
    } catch {
      resolve(0)
    }
  })
}

/**
 * Retrieve a single item by its ankama_id
 */
export async function getItemFromDb(ankama_id: number): Promise<DofusItem | null> {
  const db = await getDb()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(ankama_id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}
