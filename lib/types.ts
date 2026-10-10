export type Source = {documentId:string;name:string;page:number;text:string;score:number};
export type Message = {id:string;role:'user'|'assistant';content:string;sources?:Source[]};
export type Conversation = {id:string;title:string;messages:Message[];updatedAt:string};
export type Document = {id:string;name:string;pages:number;chunks:number;size:number;createdAt:string};
export type Chunk = {documentId:string;name:string;page:number;text:string;vector:number[]};
export type Workspace = {documents:Document[];chunks:Chunk[];conversations:Conversation[];embeddingMode?:string};
