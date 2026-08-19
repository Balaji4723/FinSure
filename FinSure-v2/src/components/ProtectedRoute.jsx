import { useEffect, useState } from "react"

import { Navigate } from "react-router-dom"

import {
  onAuthStateChanged
} from "firebase/auth"

import { auth } from "../firebase"

function ProtectedRoute({ children }) {

  const [user, setUser] = useState(undefined)

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser)

      }
    )

    return () => unsubscribe()

  }, [])

  // Loading state
  if (user === undefined) {

    return (
      <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center text-3xl">

        Loading...

      </div>
    )
  }

  return user
    ? children
    : <Navigate to="/login" />
}

export default ProtectedRoute