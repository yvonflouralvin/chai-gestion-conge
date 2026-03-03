'use server' 
import DownloadPage from '@/components/download-page/DownloadPage' 
import React from 'react'  
export default async function Page({ params }: { params: { id: string } }){
    const  id  = await params.id
    return <DownloadPage id={id} />
}