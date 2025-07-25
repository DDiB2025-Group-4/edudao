/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as VerifierRouteImport } from './routes/verifier'
import { Route as IssuerRouteImport } from './routes/issuer'
import { Route as IndexRouteImport } from './routes/index'
import { Route as HolderIndexRouteImport } from './routes/holder.index'
import { Route as HolderTokenIdRouteImport } from './routes/holder.$tokenId'

const VerifierRoute = VerifierRouteImport.update({
  id: '/verifier',
  path: '/verifier',
  getParentRoute: () => rootRouteImport,
} as any)
const IssuerRoute = IssuerRouteImport.update({
  id: '/issuer',
  path: '/issuer',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const HolderIndexRoute = HolderIndexRouteImport.update({
  id: '/holder/',
  path: '/holder/',
  getParentRoute: () => rootRouteImport,
} as any)
const HolderTokenIdRoute = HolderTokenIdRouteImport.update({
  id: '/holder/$tokenId',
  path: '/holder/$tokenId',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/issuer': typeof IssuerRoute
  '/verifier': typeof VerifierRoute
  '/holder/$tokenId': typeof HolderTokenIdRoute
  '/holder': typeof HolderIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/issuer': typeof IssuerRoute
  '/verifier': typeof VerifierRoute
  '/holder/$tokenId': typeof HolderTokenIdRoute
  '/holder': typeof HolderIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/issuer': typeof IssuerRoute
  '/verifier': typeof VerifierRoute
  '/holder/$tokenId': typeof HolderTokenIdRoute
  '/holder/': typeof HolderIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/issuer' | '/verifier' | '/holder/$tokenId' | '/holder'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/issuer' | '/verifier' | '/holder/$tokenId' | '/holder'
  id:
    | '__root__'
    | '/'
    | '/issuer'
    | '/verifier'
    | '/holder/$tokenId'
    | '/holder/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  IssuerRoute: typeof IssuerRoute
  VerifierRoute: typeof VerifierRoute
  HolderTokenIdRoute: typeof HolderTokenIdRoute
  HolderIndexRoute: typeof HolderIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/verifier': {
      id: '/verifier'
      path: '/verifier'
      fullPath: '/verifier'
      preLoaderRoute: typeof VerifierRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/issuer': {
      id: '/issuer'
      path: '/issuer'
      fullPath: '/issuer'
      preLoaderRoute: typeof IssuerRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/holder/': {
      id: '/holder/'
      path: '/holder'
      fullPath: '/holder'
      preLoaderRoute: typeof HolderIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/holder/$tokenId': {
      id: '/holder/$tokenId'
      path: '/holder/$tokenId'
      fullPath: '/holder/$tokenId'
      preLoaderRoute: typeof HolderTokenIdRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  IssuerRoute: IssuerRoute,
  VerifierRoute: VerifierRoute,
  HolderTokenIdRoute: HolderTokenIdRoute,
  HolderIndexRoute: HolderIndexRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
