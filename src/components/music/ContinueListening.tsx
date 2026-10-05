'use client';

import {
useAudioPlayer
}
from "@/app/context/AudioPlayerContext";

export default function ContinueListening({

song

}:any){

const{
playTrack
}=useAudioPlayer();

if(!song){
return null;
}

return(

<div
className="
bg-zinc-900
rounded-2xl
p-8
mb-12
flex
items-center
gap-8
"
>

<img

src={song.poster}

className="
w-48
rounded-xl
"
/>

<div>

<p
className="
text-zinc-400
"
>

Continue listening

</p>

<h1
className="
text-5xl
font-bold
my-3
"
>

{song.title}

</h1>

<p>

{song.artist}

</p>

<button

onClick={()=>

playTrack(song)

}

className="
mt-8
bg-green-600
px-8
py-3
rounded-xl
"

>

Resume

</button>

</div>

</div>

);

}