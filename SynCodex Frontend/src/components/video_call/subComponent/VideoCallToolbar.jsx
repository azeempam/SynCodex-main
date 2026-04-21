import IconButton from "../../IconButton";
import AppColors from "../../../utils/appColors";
import AppIcons from "../../../utils/appIcons";

const VideoCallToolbar = ({micDisable,camDisable,speakerOff, toggleMic,toggleCam,toggleSpeaker,toggleEndCall,toggleMore }) => {
  return (
     <div className="flex flex-col justify-end items-center pt-1 sm:pt-1.5 md:pt-2 lg:pt-3 h-full">
      <div
        className={`flex gap-3 p-1.5 sm:p-2 md:p-3 rounded-xl border-1 border-[#E4E6F3]`}
      >
        {/* Row Layout for Larger Screens, Grid Layout for Smaller Screens */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 justify-center  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <IconButton
            icon={AppIcons.micOff}
            buttonColor={
              micDisable ? AppColors.buttonColor : AppColors.container
            }
            onClick={toggleMic}
            label={micDisable ? "Mic OFF" : "Mic ON"}
          />
          <IconButton
            icon={AppIcons.speakerOff}
            buttonColor={
              speakerOff ? AppColors.container : AppColors.buttonColor
            }
            onClick={toggleSpeaker}
            label={speakerOff ? "Speaker ON" : "Speaker OFF"}
          />
          <IconButton
            icon={AppIcons.videoOff}
            buttonColor={
              camDisable ? AppColors.buttonColor : AppColors.container
            }
            onClick={toggleCam}
            label={camDisable ? "Camera OFF" : "Camera ON"}
          />
          <IconButton
            icon={AppIcons.moreHorizontal}
            buttonColor={AppColors.buttonColor}
            onClick={toggleMore}
            label="More"
          />
          <IconButton
            icon={AppIcons.callEnd}
            buttonColor={AppColors.redColor}
            onClick={toggleEndCall}
            label="End Call"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallToolbar;
