interface MusicCardProps{

    song:any;

    playlist:any[];

}
import {
  useAudioPlayer
} from '@/app/context/AudioPlayerContext';

export default function MusicCard({
    song,
    playlist
}:MusicCardProps){

    const {
        playTrack
    } = useAudioPlayer();

    return(

        <button
            onClick={()=>
                playTrack(
                    song,
                    playlist
                )
            }
            className="
            w-44
            flex-shrink-0
            "
        >

            <img
                src={song.poster}
                className="
                rounded-xl
                w-full
                aspect-square
                object-cover
                "
            />

            <div className="mt-2">

                <div className="font-semibold line-clamp-1">

                    {song.title}

                </div>

                <div className="text-zinc-400 text-sm line-clamp-1">

                    {song.artist}

                </div>

            </div>

        </button>

    );

}