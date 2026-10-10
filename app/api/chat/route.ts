import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {sessionId,mutate} from '@/lib/store';
import {embed,answer,mode} from '@/lib/ai';
import {cosine} from '@/lib/retrieval';
export const runtime='nodejs';
export const maxDuration=120;
export async function POST(req:Request){try{const body=await req.json();if(typeof body.question!=='string'||!body.question.trim()||body.question.length>4000)return NextResponse.json({error:'Enter a question up to 4,000 characters.'},{status:400});const q=body.question.trim();
 const result=await mutate(await sessionId(),async w=>{
 if(!w.chunks.length)throw new Error('Upload a PDF before asking a question.');
 if(w.embeddingMode!==mode())throw new Error('Embedding mode changed. Re-upload your documents.');
 const [vector]=await embed([q]);const sources=w.chunks.filter(c=>!body.documentId||c.documentId===body.documentId).map(c=>({...c,score:cosine(vector,c.vector)})).sort((a,b)=>b.score-a.score).slice(0,4).filter(c=>c.score>0.05).map(({vector:_,...c})=>c);
 let chat=w.conversations.find(c=>c.id===body.conversationId);if(!chat){chat={id:randomUUID(),title:q.slice(0,60),messages:[],updatedAt:new Date().toISOString()};w.conversations.unshift(chat);}
 const content=!sources.length?'I couldn’t find a relevant passage in your documents. Try a more specific question.':mode()==='live'?await answer(q,sources.map((s,i)=>`[${i+1}] ${s.name}, page ${s.page}: ${s.text}`).join('\n\n'),chat.messages.map(m=>({role:m.role,content:m.content}))):`Here are the most relevant passages from your documents:\n\n${sources.map((s,i)=>`${s.text.slice(0,550)}${s.text.length>550?'…':''} [${i+1}]`).join('\n\n')}\n\nDemo mode uses local keyword vectors and returns excerpts. Add an API key for semantic embeddings and AI-generated answers.`;
 chat.messages.push({id:randomUUID(),role:'user',content:q},{id:randomUUID(),role:'assistant',content,sources});chat.updatedAt=new Date().toISOString();return chat;
 });return NextResponse.json(result);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to answer'},{status:400});}}
