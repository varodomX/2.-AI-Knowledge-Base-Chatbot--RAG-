import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {mutate,sessionId} from '@/lib/store';
import {splitText} from '@/lib/retrieval';
import {embed,mode} from '@/lib/ai';
export const runtime='nodejs';
export const maxDuration=120;
export async function POST(req:Request){try{
 const form=await req.formData();const file=form.get('file');
 if(!(file instanceof File)||!file.name.toLowerCase().endsWith('.pdf'))return NextResponse.json({error:'Please select a PDF file.'},{status:400});
 if(file.size>10*1024*1024)return NextResponse.json({error:'PDF must be smaller than 10 MB.'},{status:400});
 const buffer=Buffer.from(await file.arrayBuffer());if(buffer.subarray(0,5).toString()!=='%PDF-')return NextResponse.json({error:'This file is not a valid PDF.'},{status:400});
 const parse=require('pdf-parse/lib/pdf-parse.js');
 const pages:{page:number;text:string}[]=[];
 const parsed=await parse(buffer,{pagerender:async(page:{pageIndex:number;getTextContent:()=>Promise<{items:{str:string}[]}>})=>{const content=await page.getTextContent();const text=content.items.map(i=>i.str).join(' ');pages.push({page:page.pageIndex+1,text});return text;}});
 const id=randomUUID();const chunks=pages.sort((a,b)=>a.page-b.page).flatMap(p=>splitText(p.text).map(text=>({documentId:id,name:file.name,page:p.page,text,vector:[] as number[]})));
 if(!chunks.length)return NextResponse.json({error:'No readable text found. Scanned PDFs need OCR before uploading.'},{status:400});
 if(chunks.length>250)return NextResponse.json({error:'This document is too long. Upload fewer than 250 text chunks.'},{status:400});
 const sid=await sessionId();const vectors=await embed(chunks.map(c=>c.text));chunks.forEach((c,i)=>c.vector=vectors[i]);
 const doc={id,name:file.name,pages:parsed.numpages,chunks:chunks.length,size:file.size,createdAt:new Date().toISOString()};
 await mutate(sid,w=>{if(w.documents.length>=20)throw new Error('Workspace limit: 20 documents. Remove a document first.');if(w.embeddingMode&&w.embeddingMode!==mode())throw new Error('Embedding mode changed. Remove existing documents and re-upload.');w.embeddingMode=mode();w.documents.push(doc);w.chunks.push(...chunks);});
 return NextResponse.json(doc);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to process PDF'},{status:400});}}
