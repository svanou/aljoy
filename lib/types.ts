export type Status='queued'|'in_progress'|'completed';
export type RequestItem={id:string;workspace_id:string;title:string;description:string;category:string;priority:string;status:Status;position:number;success:string;links:string;created_at:string;updated_at:string;complexity:string;tags:string[]};
export type Comment={id:string;body:string;author_id:string;created_at:string};
