import ToolClient from './ToolClient';
export default async function Page({params}){const {slug}=await params;return <ToolClient slug={slug}/>}
