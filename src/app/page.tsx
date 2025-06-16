'use client'

import React, { useEffect, useState } from 'react'
import { trpc } from '@/trpc/client'
import { Toaster, toast } from 'sonner'

export default function HomePage(){
  const helloQuery = trpc.greeting.hello.useQuery({ name: 'User'})
  const dbConnectionQuery = trpc.collection.testDbConnection.useQuery()

  // useState to display results
  const [trpcStatus, setTrpcStatus] = useState("loading tRPC...")
  const [dbStatus, setDbStatus] = useState("Loading DB status...")

  useEffect(() => {
    if (helloQuery.data) {
      setTrpcStatus(helloQuery.data);
      toast.success("tRPC greeting received!");
    } else if ( helloQuery.error) {
      setTrpcStatus(`tRPC Greeting Error: ${helloQuery.error.message}`)
      toast.error("tRPC greeting failed!")
    } 

    if (dbConnectionQuery.data){
      setDbStatus(dbConnectionQuery.data.message)
      toast.success("DB connection tested via tRPC")
    } else if (dbConnectionQuery.error) {
      setDbStatus(`DB Connection Error: ${dbConnectionQuery.error.message}`);
      toast.error("DB connection test failed!");
    }
  }, [helloQuery.data, helloQuery.error, dbConnectionQuery.data, dbConnectionQuery.error]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
      <Toaster position="top-center" richColors />
      <h1 className="text-4xl font-bold text-gray-800 mb-6">TRPC & DB Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-4">
        <p className="text-lg text-gray-700">TRPC Greeting: {trpcStatus}</p>
        <p className="text-lg text-gray-700">DB Connection: {dbStatus}</p>
      </div>
      <p className="text-gray-500">
      </p>
    </div>
  );

}