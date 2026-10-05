'use client';

import MusicCard from "./MusicCard";

export default function MusicRow({

    title,

    songs

}:any){

    if(
        !songs ||
        songs.length===0
    ){
        return null;
    }

    return(

        <section className="mb-10">

            <h2 className="text-3xl font-bold mb-5">

                {title}

            </h2>

            <div className="flex gap-5 overflow-x-auto">

                {

                    songs.map(
                        (song:any)=>(
                            <MusicCard

                                key={song.mediaId}

                                song={song}

                                playlist={songs}

                            />
                        )
                    )

                }

            </div>

        </section>

    );

}