import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-base font-semibold text-slate-900">{title}</Text>
      <Text className="text-sm leading-6 text-slate-600">{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <>
      <Head>
        <title>이용약관 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="보수가계부(BOSU Ledger) 서비스 이용약관입니다." />
      </Head>
      <Screen backgroundClassName="bg-white">
      <View className="gap-1">
        <Pressable onPress={() => router.back()} className="mb-1 self-start">
          <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-slate-900">이용약관</Text>
        <Text className="text-sm text-slate-400">시행일: 2026년 9월 4일</Text>
      </View>

      <View className="gap-5">
        <Section title="1. 서비스 소개 및 운영자">
          BOSU Ledger는 부부·가족이 함께 쓰는 가계부 앱이에요. 초대 코드로 배우자를 가계부에
          초대하면, 두 사람이 입력한 수입·지출·자산 내역을 한 가계부에서 같이 보고 관리할 수
          있어요. 이 서비스는 별도 사업자 등록 없이 개인이 운영하고 있으며, 문의는
          doslxk@gmail.com으로 받고 있어요.
        </Section>
        <Section title="2. 계정 및 가입">
          이메일로 회원가입하고, 하나의 계정으로 하나의 가계부에만 속할 수 있어요. 만 14세
          미만은 가입할 수 없어요. 계정 정보는 본인이 직접 관리하고, 비밀번호가 새어나가지
          않도록 주의해주세요. 타인의 이메일이나 정보를 도용해 가입하거나, 계정을 무단으로
          대여·양도하는 행위는 금지돼요.
        </Section>
        <Section title="3. 이용자의 의무">
          서비스를 부정한 목적으로 이용하거나, 시스템에 비정상적으로 접근·부하를 주는 행위,
          다른 이용자의 가계부 데이터에 무단으로 접근하려는 행위는 금지돼요. 이를 위반하면
          사전 통지 후 이용을 제한하거나 계정을 정지할 수 있어요.
        </Section>
        <Section title="4. 입력하는 정보">
          거래 내역, 자산 정보, 카테고리 등 가계부에 입력하는 모든 내용은 이용자 본인이 직접
          작성해요. 입력한 금액과 날짜가 정확한지는 이용자가 확인할 책임이 있어요.
        </Section>
        <Section title="5. 시세·실거래가 정보에 대한 면책">
          부동산 실거래가, 차량 시세, 주식·코인 시세 등은 외부 기관·서비스의 데이터를 참고용으로
          보여주는 것으로, 실제 거래 가격이나 투자 판단의 근거가 될 수 없어요. 이 정보의
          정확성·최신성은 보장되지 않으며, 이를 이용한 결정으로 발생한 손해에 대해 서비스는
          책임지지 않아요.
        </Section>
        <Section title="6. 서비스 변경·중단">
          더 나은 기능을 위해 서비스 내용이 바뀔 수 있고, 운영상 필요한 경우 서비스를 일시
          중단하거나 종료할 수 있어요. 이런 경우 최대한 미리 알려드릴게요.
        </Section>
        <Section title="7. 탈퇴">
          설정 화면에서 언제든 계정을 삭제(탈퇴)할 수 있고, 탈퇴 시 계정 정보는 즉시
          삭제돼요. 다만 배우자와 함께 쓰는 가계부의 거래 내역 등은 가계부 자체의 공유
          데이터이므로 탈퇴 후에도 남아있을 수 있고, 이 경우 작성자 표시만 사라져요.
        </Section>
        <Section title="8. 유료화">
          현재 이 서비스는 무료로 제공돼요. 추후 유료 기능을 도입하는 경우, 이용요금·결제·환불
          방법을 사전에 앱 내 공지로 안내하고 이 약관에도 반영할게요.
        </Section>
        <Section title="9. 책임의 제한">
          천재지변, 정전, 통신 장애 등 운영자가 통제할 수 없는 사유로 발생한 서비스 장애에
          대해서는 책임을 지지 않아요. 무료로 제공되는 서비스의 특성상, 관련 법령이 허용하는
          범위에서 서비스 이용으로 발생한 손해에 대한 책임이 제한될 수 있어요.
        </Section>
        <Section title="10. 약관의 변경">
          이 약관의 내용이 바뀌면 시행일을 갱신하고, 시행 전에 앱 내 공지를 통해 미리
          알려드릴게요. 변경된 약관에 동의하지 않으면 계정을 탈퇴할 수 있어요.
        </Section>
        <Section title="11. 문의 및 분쟁 해결">
          이용 중 궁금한 점이나 문제가 있으면 doslxk@gmail.com으로 알려주세요. 이 약관은
          대한민국 법령에 따라 해석돼요.
        </Section>
      </View>
      </Screen>
    </>
  );
}
