import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  numero: number;
  status?: 'pendente' | 'tratado';
  onPress: () => void;
};

export default function DenteSvg({ numero, status, onPress }: Props) {
  const cor =
    status === 'tratado'
      ? '#2ecc71'
      : status === 'pendente'
      ? '#f1c40f'
      : '#ecf0f1';

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Svg width={38} height={48} viewBox="0 0 64 80">
        {/* Corpo do dente */}
        <Path
          d="
            M20 8
            Q32 0 44 8
            Q52 18 48 36
            Q46 52 40 70
            Q36 80 32 80
            Q28 80 24 70
            Q18 52 16 36
            Q12 18 20 8
          "
          fill={cor}
          stroke="#bbb"
          strokeWidth={2}
        />

        {/* bolinha status */}
        {status && (
          <Circle
            cx="48"
            cy="10"
            r="6"
            fill={status === 'tratado' ? '#2ecc71' : '#f1c40f'}
            stroke="#fff"
            strokeWidth={2}
          />
        )}
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '12.5%',
    alignItems: 'center',
    marginVertical: 6,
  },
});
