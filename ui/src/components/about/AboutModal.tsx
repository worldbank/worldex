import { Modal, Typography } from '@mui/material';
import Background from './Background';
import VisionValueProposition from './VisionValueProposition';

export default function AboutModal() {
  return (
    <Modal open>
      <div className="
        absolute
        bg-white
        width-[400px]
        height-[100px]
        top-1/2
        left-1/2
        transform
        -translate-x-1/2
        -translate-y-1/2
        p-6
        rounded-md"
      >
        <Typography variant="h4">
          WorldEx: Indexing the World for Subnational Data Discoverability
        </Typography>
        <Background />
        <VisionValueProposition />
      </div>
    </Modal>
  );
}
