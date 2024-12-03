import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js"; // Assuming correct path

const NetworkSpeedBar = () => {
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const speedData = await getNetworkSpeed();
        setDownloadSpeed(speedData.downloadSpeed);
        setUploadSpeed(speedData.uploadSpeed);
      } catch (error) {
        console.error("Error fetching network speed:", error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return Widget.Box({
    children: [
      Widget.Box({
        className: "network-speed-meter",
        children: [
          Widget.Label({
            text: `${downloadSpeed} Mbps`,
            className: "speed-label",
          }),
          MaterialIcon({
            icon: "download",
            size: 24,
          }),
        ],
      }),
      Widget.Box({
        className: "network-speed-meter",
        children: [
          Widget.Label({
            text: `${uploadSpeed} Mbps`,
            className: "speed-label",
          }),
          MaterialIcon({
            icon: "upload",
            size: 24,
          }),
        ],
      }),
    ],
  });
};

export default NetworkSpeedBar;
