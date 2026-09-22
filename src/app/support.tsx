import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

function Faq({ q, children }: { q: string; children: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-base font-semibold text-slate-900">{q}</Text>
      <Text className="text-sm leading-6 text-slate-600">{children}</Text>
    </View>
  );
}

export default function SupportScreen() {
  return (
    <>
      <Head>
        <title>고객 지원 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="보수가계부(BOSU Ledger) 사용 중 궁금한 점이나 문제를 도와드려요." />
      </Head>
      <Screen backgroundClassName="bg-white">
        <View className="gap-1">
          <Pressable onPress={() => router.back()} className="mb-1 self-start">
            <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">고객 지원</Text>
          <Text className="text-sm text-slate-500">
            사용하시다가 막히는 부분이 있으면 아래를 먼저 확인해보시고, 그래도 해결이 안 되면
            언제든 연락 주세요.
          </Text>
        </View>

        <View className="gap-5">
          <Faq q="문의는 어디로 하나요?">
            doslxk@gmail.com으로 이메일 보내주시면 확인 후 답변드려요. 앱 안에서는 설정 &gt;
            개발자에게 기능 요청하기 메뉴로도 문의·요청을 남길 수 있고, 답변이 달리면
            이메일로 알려드려요.
          </Faq>
          <Faq q="비밀번호를 잊어버렸어요">
            로그인 화면의 "비밀번호를 잊으셨나요?"를 눌러 가입한 이메일로 재설정 메일을
            받으실 수 있어요.
          </Faq>
          <Faq q="가족/배우자와 가계부를 같이 쓰려면요?">
            설정 &gt; 가계부 정보에서 초대 코드를 확인하고 공유하면, 상대방이 회원가입할 때
            그 코드를 입력해서 같은 가계부에 들어올 수 있어요. 인원 제한은 없어요.
          </Faq>
          <Faq q="카드 명세서 업로드가 실패해요">
            삼성카드·경기지역화폐·쿠팡 엑셀 파일 형식을 지원해요. 카드사에서 받은 파일을
            수정 없이 그대로 올려주시고, 그래도 실패하면 어떤 카드사·파일인지와 함께
            doslxk@gmail.com으로 보내주시면 확인해드려요.
          </Faq>
          <Faq q="계정을 삭제하고 싶어요">
            설정 &gt; 마이페이지에서 계정을 삭제할 수 있어요. 삭제하면 계정 정보는 즉시
            삭제되고, 다른 구성원과 함께 쓰던 가계부의 거래 내역은 작성자 표시만 사라진 채
            남아있어요.
          </Faq>
          <Faq q="버그를 발견했어요">
            어떤 화면에서 어떤 동작을 했을 때 문제가 생겼는지와 함께 doslxk@gmail.com으로
            알려주시면 큰 도움이 돼요. 스크린샷이 있으면 더 좋아요.
          </Faq>
        </View>
      </Screen>
    </>
  );
}
