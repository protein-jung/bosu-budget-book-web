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

/** 로그인 없이도 접근 가능한 계정 삭제 안내 페이지. 구글 플레이는 앱 안 삭제 기능과 별개로,
 * 로그인 없이 볼 수 있는 웹페이지에서 삭제 절차를 안내할 것을 요구한다(2023년~). */
export default function DeleteAccountScreen() {
  return (
    <>
      <Head>
        <title>계정 삭제 안내 | 보수가계부 (BOSU Ledger)</title>
        <meta name="description" content="보수가계부(BOSU Ledger) 계정과 데이터를 삭제하는 방법을 안내합니다." />
      </Head>
      <Screen backgroundClassName="bg-white" topInset>
        <View className="gap-1">
          <Pressable onPress={() => router.back()} className="mb-1 self-start">
            <Text className="text-sm font-medium text-primary">‹ 뒤로</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">계정 삭제 안내</Text>
        </View>

        <View className="gap-5">
          <Section title="앱에서 직접 삭제하기">
            보수가계부에 로그인한 뒤 설정 &gt; 마이페이지 화면 아래의 "회원 탈퇴" 버튼을
            누르면 바로 삭제할 수 있어요. 삭제는 즉시 처리되고 되돌릴 수 없어요.
          </Section>
          <Section title="로그인할 수 없는 경우">
            비밀번호를 잊었거나 다른 이유로 로그인이 안 되면, 가입할 때 쓴 이메일 주소와 함께
            doslxk@gmail.com으로 삭제 요청을 보내주세요. 본인 확인 후 처리해드려요. 보통 영업일
            기준 3일 이내에 처리돼요.
          </Section>
          <Section title="삭제되는 정보">
            계정(이메일, 이름, 생년월일)과 로그인 정보가 즉시 삭제돼요. 본인이 속했던 가계부에서
            혼자 쓰던 자산·카테고리·고정비 등 개인 설정도 함께 삭제돼요.
          </Section>
          <Section title="삭제되지 않고 남는 정보">
            다른 구성원과 함께 쓰던 가계부의 거래 내역은 그 가계부의 공유 데이터라서 삭제 후에도
            남아있어요. 다만 작성자 이름은 더 이상 표시되지 않고 "탈퇴한 사용자"로 바뀌어요.
          </Section>
        </View>
      </Screen>
    </>
  );
}
