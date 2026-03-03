'use client'
import React from 'react'
import { PrinterIcon } from "lucide-react"
import { useRouter } from 'next/navigation'


export default function PrintFunction(){
    // const router = useRouter()
    // React.useEffect(()=>{
    //     setTimeout(()=>{
    //         print()
            
    //     },5000)
    //     setTimeout(()=>{
    //         router.back()
    //     }, 7000 )
    // })
    return <PrinterIcon onClick={()=>print()}/>
}