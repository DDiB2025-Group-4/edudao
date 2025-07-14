import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/issuer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/issuer"!</div>
}
